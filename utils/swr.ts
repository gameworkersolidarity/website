export const doNotFetch = () => {
  return {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  }
}