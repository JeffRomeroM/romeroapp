import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pegleompebinpcvjodjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2xlb21wZWJpbnBjdmpvZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MzcwMDcsImV4cCI6MjA1NjExMzAwN30.siGhg1VP_p7XkARnqpjkyfp8SxEMC_dok1WAwYV72es'

export const supabase = createClient(supabaseUrl, supabaseKey)
