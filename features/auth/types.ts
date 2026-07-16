export type AppUser = {
  id: string
  name: string
  email: string
  createdAt: string
  avatarUrl?: string
  avatarPath?: string
}

export type ProfileUpdate = {
  avatarFile?: File
  name: string
  removeAvatar: boolean
}
