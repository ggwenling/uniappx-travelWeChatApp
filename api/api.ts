import http from "./request"

export const getTopBar = () =>{
  return http('/user/getBanner')
}
export const getHomeList = () =>{
  return http('/user/getHomeList')
}

export const userLogin= (code) =>{
 return http('/login',{code},'POST')
}

export const getUserInfo = () =>{
  return http('/getUserInfo',)
}

export const getPlayList = () =>{
  return http('/detail/project')
}

export const getProject = (id) =>{
  return http('/project/info',{id})
}
export const getLikeList = () =>{
  return http('/like/list')
}