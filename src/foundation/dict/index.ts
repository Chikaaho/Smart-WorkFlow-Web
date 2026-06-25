import { ref, type Ref } from 'vue'
import { request } from '@/foundation/request'

export interface DictItem {
  label: string
  value: string
  tagType?: string
  cssClass?: string
}

/** 后端字典响应 DTO：value 字段名为 code（决策文档 v2 §1）。 */
interface DictItemDTO {
  code: string
  label: string
}

function mapDictItemDTO(dto: DictItemDTO): DictItem {
  return {
    label: dto.label,
    value: dto.code,
  }
}

const dictRegistry = new Map<string, DictItem[]>()
const loadingDict = new Map<string, Promise<void>>()

export async function loadDict(type: string): Promise<DictItem[]> {
  const items = await request<DictItemDTO[]>({
    method: 'GET',
    url: `/system/dict/data/list/${type}`,
  })
  return items.map(mapDictItemDTO)
}

/** 失败不缓存，允许下次 useDict 按需重试；失败本身非阻塞，不影响应用其余部分。 */
function ensureDictLoaded(type: string): Promise<void> {
  if (dictRegistry.has(type)) {
    return Promise.resolve()
  }
  const inFlight = loadingDict.get(type)
  if (inFlight) {
    return inFlight
  }
  const promise = loadDict(type)
    .then((items) => {
      dictRegistry.set(type, items)
    })
    .catch(() => {
      // TODO(skeleton): 字典加载失败降级，仅 console 提示，不阻塞应用。
      console.warn(`[dict] failed to load type: ${type}`)
    })
    .finally(() => {
      loadingDict.delete(type)
    })
  loadingDict.set(type, promise)
  return promise
}

/**
 * 业务层取字典只走这里，禁止硬编码枚举到文案的映射。
 */
export function useDict(type: string): { items: Ref<DictItem[]> } {
  const items = ref<DictItem[]>(dictRegistry.get(type) ?? [])
  void ensureDictLoaded(type).then(() => {
    items.value = dictRegistry.get(type) ?? []
  })
  return { items }
}
