import { Rule } from './api'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'select' | 'boolean' | 'number' | 'array'
  defaultValue?: any
  options?: string[]
  helpText?: string
  required?: boolean
  placeholder?: string
}

// Extract all field references from JSON Logic
export function extractFieldsFromLogic(logic: any): string[] {
  const fields = new Set<string>()

  function traverse(obj: any) {
    if (typeof obj !== 'object' || obj === null) return

    // Handle {"var": "field_name"}
    if (obj.var) {
      if (typeof obj.var === 'string') {
        // ✅ Filter out params fields but track them separately
        if (!obj.var.startsWith('params.')) {
          fields.add(obj.var)
        }
      } else if (Array.isArray(obj.var)) {
        // ✅ Handle array notation like ["vegetation.0.distance_to_window"]
        const fieldName = obj.var[0]?.split('.')[0]
        if (fieldName && !fieldName.startsWith('params')) {
          fields.add(fieldName)
        }
      }
    }

    // Recursively check all values
    Object.values(obj).forEach(traverse)
  }

  traverse(logic)
  return Array.from(fields)
}

// ✨ NEW: Extract parameter-based fields
export function extractParameterFields(rules: Rule[]): FormField[] {
  const paramFields: FormField[] = []

  rules.forEach((rule) => {
    if (!rule.params || Object.keys(rule.params).length === 0) return

    // Analyze how parameters are used in logic
    const logicStr = JSON.stringify(rule.logic)

    // Look for window_mult references
    if (rule.params.window_mult && logicStr.includes('window_mult')) {
      paramFields.push({
        name: 'Window Type',
        label: 'Window Type',
        type: 'select',
        options: Object.keys(rule.params.window_mult),
        defaultValue: 'Double',
        helpText: `Used in ${rule.name} - affects safety calculations`
      })
    }

    // Look for veg_div references
    if (rule.params.veg_div && logicStr.includes('veg_div')) {
      // This is handled by vegetation array, but we could add vegetation type validation
    }

    // Look for other parameter patterns
    Object.keys(rule.params).forEach((paramKey) => {
      if (logicStr.includes(paramKey)) {
        const paramValue = rule.params[paramKey]

        // If it's an object with keys, those keys are likely user options
        if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
          const fieldName = paramKey
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())

          // Avoid duplicates
          if (!paramFields.some((f) => f.name === fieldName)) {
            paramFields.push({
              name: fieldName,
              label: fieldName,
              type: 'select',
              options: Object.keys(paramValue),
              defaultValue: Object.keys(paramValue)[0],
              helpText: `Parameter from ${rule.name}`
            })
          }
        }
      }
    })
  })

  return paramFields
}

// ✅ Enhanced to also include parameter-derived fields
export function generateFormFields(rules: Rule[]): FormField[] {
  const fieldNames = new Set<string>()

  // Extract all unique field names from all rules
  rules.forEach((rule) => {
    const fields = extractFieldsFromLogic(rule.logic)
    fields.forEach((field) => fieldNames.add(field))
  })

  // ✅ Also extract fields that are implied by parameters
  const parameterFields = extractParameterImpliedFields(rules)
  parameterFields.forEach((fieldName) => fieldNames.add(fieldName))

  // Generate form fields
  return Array.from(fieldNames).map((fieldName) => {
    const field: FormField = {
      name: fieldName,
      label: fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      type: inferFieldType(fieldName),
      defaultValue: getDefaultValue(fieldName, rules)
    }

    // Add options for select fields
    const options = getFieldOptions(fieldName, rules)
    if (options.length > 0) {
      field.options = options
    }

    return field
  })
}

// ✅ NEW: Extract fields that are implied by rule parameters
function extractParameterImpliedFields(rules: Rule[]): string[] {
  const impliedFields = new Set<string>()

  rules.forEach((rule) => {
    if (!rule.params) return

    const logicStr = JSON.stringify(rule.logic)

    // If logic references window_mult but we don't have Window Type field
    if (rule.params.window_mult && logicStr.includes('window_mult')) {
      impliedFields.add('Window Type')
    }

    // If logic references veg_div, ensure we have vegetation array
    if (rule.params.veg_div && logicStr.includes('veg_div')) {
      impliedFields.add('vegetation')
    }
  })

  return Array.from(impliedFields)
}

// ✅ Enhanced default values that look at rule parameters
function getDefaultValue(fieldName: string, rules: Rule[]): any {
  // Static defaults first
  const staticDefaults: Record<string, any> = {
    attic_vent_has_screens: 'True',
    roof_type: 'Class A',
    wildfire_risk_category: 'A'
  }

  if (staticDefaults[fieldName]) {
    return staticDefaults[fieldName]
  }

  // ✅ Dynamic defaults based on rule parameters
  if (fieldName === 'vegetation') {
    // Find what vegetation types are actually supported
    const vegTypes = new Set<string>()
    rules.forEach((rule) => {
      if (rule.params?.veg_div) {
        Object.keys(rule.params.veg_div).forEach((type) => vegTypes.add(type))
      }
    })

    const firstType = Array.from(vegTypes)[0] || 'Tree'
    return [{ Type: firstType, distance_to_window: 100 }]
  }

  if (fieldName === 'Window Type') {
    // Find what window types are actually supported
    for (const rule of rules) {
      if (rule.params?.window_mult) {
        const firstType = Object.keys(rule.params.window_mult)[0]
        return firstType || 'Double'
      }
    }
    return 'Double'
  }

  return ''
}

// ✅ Enhanced options extraction that looks at parameters
function getFieldOptions(fieldName: string, rules: Rule[]): string[] {
  const options = new Set<string>()

  // Extract from rule logic first
  rules.forEach((rule) => {
    function traverse(obj: any) {
      if (typeof obj !== 'object' || obj === null) return

      if (obj.in && Array.isArray(obj.in) && obj.in.length === 2) {
        const [varObj, optionsArray] = obj.in
        if (varObj?.var === fieldName && Array.isArray(optionsArray)) {
          optionsArray.forEach((option: any) => options.add(option))
        }
      }

      Object.values(obj).forEach(traverse)
    }

    traverse(rule.logic)
  })

  // ✅ Also extract from rule parameters
  if (fieldName === 'Window Type') {
    rules.forEach((rule) => {
      if (rule.params?.window_mult) {
        Object.keys(rule.params.window_mult).forEach((type) =>
          options.add(type)
        )
      }
    })
  }

  return Array.from(options)
}

// ✅ Smart type inference - this is the key fix!
function inferFieldType(
  fieldName: string,
  options?: string[]
): FormField['type'] {
  if (fieldName.includes('has_') || fieldName.includes('is_')) return 'boolean'
  if (fieldName.includes('distance') || fieldName.includes('_ft'))
    return 'number'
  if (fieldName === 'vegetation') return 'array' // ✅ This will fix vegetation!
  if (options && options.length > 0) return 'select'
  return 'text'
}

// ✅ Static options for known fields
function getStaticOptions(fieldName: string): string[] | undefined {
  const options: Record<string, string[]> = {
    roof_type: ['Class A', 'Class B', 'Class C'],
    wildfire_risk_category: ['A', 'B', 'C', 'D'],
    'Window Type': ['Single', 'Double', 'Tempered Glass'],
    attic_vent_has_screens: ['True', 'False']
  }
  return options[fieldName]
}
