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

    const fetchProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (profile) setProfile(profile)
    }

    // onAuthStateChange가 INITIAL_SESSION 이벤트로 즉시 현재 세션을 알려줌
    // → 세션 확인 즉시 isLoading(false), 프로필은 백그라운드 fetch
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setIsLoading(false)
        fetchProfile(session.user.id)
      } else {
        reset()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setIsLoading, reset])

  return { user, profile, role, isLoading }
}
