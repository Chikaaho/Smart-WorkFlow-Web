import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/foundation/request', () => ({ request: vi.fn() }))
vi.mock('@/adapters/form-designer', () => ({
  parseDefinition: vi.fn(),
}))

import { request } from '@/foundation/request'
import { parseDefinition } from '@/adapters/form-designer'
import { getFormDef, getFormDefinition, submitForm, listSubmissions } from './form'

describe('modules/lowcode/api/form', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset()
    vi.mocked(parseDefinition).mockReset()
  })

  it('getFormDef calls correct URL with GET', async () => {
    vi.mocked(request).mockResolvedValueOnce({ formKey: 'k', formName: 'Form' })
    await getFormDef('test-key')
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/form/def/by-key/test-key' }),
    )
  })

  it('getFormDefinition calls correct URL and delegates to parseDefinition', async () => {
    const rawJson = '{"title":"T","fields":[]}'
    const expectedSchema = { title: 'T', fields: [] }
    vi.mocked(request).mockResolvedValueOnce(rawJson)
    vi.mocked(parseDefinition).mockReturnValueOnce(expectedSchema)

    const schema = await getFormDefinition('test-key')

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/form/def/by-key/test-key/definition',
      }),
    )
    expect(parseDefinition).toHaveBeenCalledWith(rawJson)
    expect(schema).toEqual(expectedSchema)
  })

  it('submitForm (seam) posts to correct URL and propagates rejection', async () => {
    vi.mocked(request).mockRejectedValueOnce(new Error('Network Error'))
    await expect(submitForm('my-form', { field: 'value' })).rejects.toThrow('Network Error')
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: '/form/submit/my-form' }),
    )
  })

  it('submitForm (seam) passes request body correctly', async () => {
    vi.mocked(request).mockRejectedValueOnce(new Error('x'))
    const body = { name: 'Alice', age: 30 }
    await expect(submitForm('k', body)).rejects.toThrow()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ data: body }))
  })

  it('listSubmissions (seam) GETs correct URL with page params and propagates rejection', async () => {
    vi.mocked(request).mockRejectedValueOnce(new Error('Network Error'))
    await expect(listSubmissions('my-form', { pageNum: 2, pageSize: 20 })).rejects.toThrow(
      'Network Error',
    )
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/form/submit/by-key/my-form/list',
        params: { pageNum: 2, pageSize: 20 },
      }),
    )
  })

  it('listSubmissions adapts backend records→list when endpoint resolves', async () => {
    vi.mocked(request).mockResolvedValueOnce({
      records: [{ id: '1', val: 'a' }],
      total: 1,
      pageNum: 1,
      pageSize: 10,
    })
    const result = await listSubmissions('k', { pageNum: 1, pageSize: 10 })
    expect(result.list).toEqual([{ id: '1', val: 'a' }])
    expect(result.total).toBe(1)
  })
})
