const baseUrl = 'https://m1.apifoxmock.com/m1/4728220-0-default/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

// 请求缓存配置
interface CacheItem {
  data: any
  time: number
}

// 缓存存储对象
const cacheMap = new Map<string, CacheItem>()

// 缓存有效期：5分钟
const CACHE_TIME = 5 * 60 * 1000

// 正在进行的请求映射（防止重复请求）
const pendingRequests = new Map<string, Promise<any>>()

/**
 * 生成缓存键
 * @param url 请求URL
 * @param data 请求数据
 * @param method 请求方法
 */
function getCacheKey(url: string, data: any, method: HttpMethod): string {
  return `${method}:${url}:${JSON.stringify(data)}`
}

/**
 * 获取缓存数据
 * @param key 缓存键
 */
function getCache(key: string): any | null {
  const cached = cacheMap.get(key)
  if (cached && Date.now() - cached.time < CACHE_TIME) {
    console.log('使用缓存数据:', key)
    return cached.data
  }
  // 缓存过期，删除
  if (cached) {
    cacheMap.delete(key)
  }
  return null
}

/**
 * 设置缓存数据
 * @param key 缓存键
 * @param data 数据
 */
function setCache(key: string, data: any): void {
  cacheMap.set(key, {
    data,
    time: Date.now()
  })
}

/**
 * 清除所有缓存
 */
export function clearCache(): void {
  cacheMap.clear()
  console.log('已清除所有请求缓存')
}

/**
 * HTTP 请求封装（带缓存和防重复请求）
 * @param url 请求路径
 * @param data 请求数据
 * @param method 请求方法
 * @param useCache 是否使用缓存（默认 GET 请求使用缓存）
 */
export default function http(
  url: string, 
  data: any = {}, 
  method: HttpMethod = 'GET',
  useCache: boolean = method === 'GET'
): Promise<any> {
  const cacheKey = getCacheKey(url, data, method)
  
  // 1. 检查缓存（仅 GET 请求且开启缓存）
  if (useCache && method === 'GET') {
    const cachedData = getCache(cacheKey)
    if (cachedData !== null) {
      return Promise.resolve(cachedData)
    }
  }
  
  // 2. 检查是否有相同的请求正在进行（防止重复请求）
  const pendingRequest = pendingRequests.get(cacheKey)
  if (pendingRequest) {
    console.log('请求合并:', cacheKey)
    return pendingRequest
  }
  
  // 3. 发起新请求
  const requestPromise = new Promise((resolve, reject) => {
    uni.request({
      url: baseUrl + url,
      data,
      method: method as any,
      header: {
        'token': uni.getStorageSync('token') || ''
      },
      // 设置超时时间：10秒
      timeout: 10000,
      success: (res: any) => {
        if (res.statusCode === 200) {
          if (res.data.code === 1) {
            // 成功：缓存数据
            if (useCache && method === 'GET') {
              setCache(cacheKey, res.data.data)
            }
            resolve(res.data.data)
          } else {
            reject(res.data)
          }
        } else {
          reject(res)
        }
      },
      fail: (err: any) => {
        console.error('请求失败:', url, err)
        reject(err)
      },
      complete: () => {
        // 请求完成后，从待处理列表中移除
        pendingRequests.delete(cacheKey)
      }
    })
  })
  
  // 4. 将请求添加到待处理列表
  pendingRequests.set(cacheKey, requestPromise)
  
  return requestPromise
}
