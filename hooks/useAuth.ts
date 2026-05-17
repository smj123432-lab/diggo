'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'

// 클라이언트에서 인증 상태를 구독하고 Zustand store에 동기화하는 훅
export function useAuth() {
  const { user, profile, role, isLoading, setUser, setProfile, setIsLoading, reset } =
    useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // 현재 세션 확인
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      } else {
        reset()
      }
      setIsLoading(false)
    }).catch(() => {
      reset()
    })

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profile)
      } else {
        reset()
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setIsLoading, reset])

  return { user, profile, role, isLoading }
}
