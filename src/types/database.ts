export interface HumorFlavor {
  id: number
  slug: string
  description: string | null
  created_datetime_utc: string
  modified_datetime_utc: string
}

export interface HumorFlavorStep {
  id: number
  humor_flavor_id: number
  order_by: number
  llm_temperature: number | null
  llm_input_type_id: number
  llm_output_type_id: number
  llm_model_id: number
  humor_flavor_step_type_id: number
  llm_system_prompt: string | null
  llm_user_prompt: string | null
  description: string | null
  created_datetime_utc: string
  modified_datetime_utc: string
}

export interface HumorFlavorStepWithRelations extends HumorFlavorStep {
  llm_model: LlmModel | null
  llm_input_type: LlmInputType | null
  llm_output_type: LlmOutputType | null
  step_type: HumorFlavorStepType | null
}

export interface HumorFlavorStepType {
  id: number
  slug: string
  description: string
}

export interface LlmModel {
  id: number
  name: string
  provider_model_id: string
  is_temperature_supported: boolean
  llm_provider_id: number
}

export interface LlmProvider {
  id: number
  name: string
}

export interface LlmInputType {
  id: number
  slug: string
  description: string
}

export interface LlmOutputType {
  id: number
  slug: string
  description: string
}

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  is_superadmin: boolean
  is_matrix_admin: boolean
}

export interface Caption {
  id: string
  content: string | null
  is_public: boolean
  profile_id: string
  image_id: string
  humor_flavor_id: number | null
  like_count: number
  created_datetime_utc: string
}

export interface CaptionWithRelations extends Caption {
  image: Image | null
  profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null
}

export interface Image {
  id: string
  url: string | null
  image_description: string | null
  is_common_use: boolean | null
  is_public: boolean | null
}
