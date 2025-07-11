import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// إعداد الجداول المطلوبة
export const setupDatabase = async () => {
  try {
    console.log('إعداد قاعدة البيانات...')
    
    // التحقق من وجود الجداول
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('خطأ في التحقق من جدول profiles:', profilesError)
    } else {
      console.log('جدول profiles متاح')
    }

    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select('*')
      .limit(1)
    
    if (requestsError) {
      console.error('خطأ في التحقق من جدول requests:', requestsError)
    } else {
      console.log('جدول requests متاح')
    }

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .limit(1)
    
    if (inventoryError) {
      console.error('خطأ في التحقق من جدول inventory:', inventoryError)
    } else {
      console.log('جدول inventory متاح')
    }

    return { success: true }
  } catch (error) {
    console.error('خطأ في إعداد قاعدة البيانات:', error)
    return { success: false, error }
  }
}

// وظائف إدارة الطلبات
export const saveRequest = async (request: any) => {
  try {
    const { data, error } = await supabase
      .from('requests')
      .insert([request])
      .select()

    if (error) {
      console.error('خطأ في حفظ الطلب:', error)
      return { data: null, error }
    }

    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('خطأ في حفظ الطلب:', error)
    return { data: null, error }
  }
}

export const getRequests = async (userId?: string) => {
  try {
    let query = supabase.from('requests').select('*')
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('خطأ في جلب الطلبات:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('خطأ في جلب الطلبات:', error)
    return { data: [], error }
  }
}

export const updateRequest = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('requests')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      console.error('خطأ في تحديث الطلب:', error)
      return { data: null, error }
    }

    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('خطأ في تحديث الطلب:', error)
    return { data: null, error }
  }
}

export const deleteRequest = async (id: string) => {
  try {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('خطأ في حذف الطلب:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('خطأ في حذف الطلب:', error)
    return { error }
  }
}

// وظائف إدارة المخزون
export const saveInventoryItem = async (item: any) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .upsert([item], { onConflict: 'name' })
      .select()

    if (error) {
      console.error('خطأ في حفظ عنصر المخزون:', error)
      return { data: null, error }
    }

    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('خطأ في حفظ عنصر المخزون:', error)
    return { data: null, error }
  }
}

export const getInventoryItems = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('خطأ في جلب عناصر المخزون:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('خطأ في جلب عناصر المخزون:', error)
    return { data: [], error }
  }
}

// وظائف إدارة السلع منتهية الصلاحية
export const saveExpiringItem = async (item: any) => {
  try {
    const { data, error } = await supabase
      .from('expiring_items')
      .insert([item])
      .select()

    if (error) {
      console.error('خطأ في حفظ السلعة منتهية الصلاحية:', error)
      return { data: null, error }
    }

    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('خطأ في حفظ السلعة منتهية الصلاحية:', error)
    return { data: null, error }
  }
}

export const getExpiringItems = async () => {
  try {
    const { data, error } = await supabase
      .from('expiring_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('خطأ في جلب السلع منتهية الصلاحية:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('خطأ في جلب السلع منتهية الصلاحية:', error)
    return { data: [], error }
  }
}

// وظائف إدارة الرسائل
export const sendMessage = async (message: any) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()

    if (error) {
      console.error('خطأ في إرسال الرسالة:', error)
      return { data: null, error }
    }

    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error)
    return { data: null, error }
  }
}

export const getMessages = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('خطأ في جلب الرسائل:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('خطأ في جلب الرسائل:', error)
    return { data: [], error }
  }
}

// وظائف المصادقة
export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('خطأ في تسجيل الدخول:', error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error)
    return { user: null, error }
  }
}

export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('خطأ في تسجيل الخروج:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error)
    return { error }
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('خطأ في جلب المستخدم الحالي:', error)
      return { user: null, error }
    }

    return { user, error: null }
  } catch (error) {
    console.error('خطأ في جلب المستخدم الحالي:', error)
    return { user: null, error }
  }
}

// وظائف إدارة المستخدمين
export const createUser = async (user: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([user])
      .select()

    if (error) {
      console.error('خطأ في إنشاء المستخدم:', error)
      return { data: null, error }
    }

    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error)
    return { data: null, error }
  }
}
