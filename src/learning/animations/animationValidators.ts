interface MessageState {
  operation?: string
  message?: string
}

export function validateAnimationStates(id: string, states: MessageState[]): string[] {
  const errors: string[] = []

  if (!states.length) {
    errors.push(`${id} has no states.`)
    return errors
  }

  states.forEach((state, index) => {
    if (!state.operation) errors.push(`${id} state ${index + 1} is missing operation.`)
    if (!state.message) errors.push(`${id} state ${index + 1} is missing message.`)
  })

  return errors
}
