// Skyfarer specific utility functions

const INSTRUCTOR_TYPES = ['instructor', 'school']

export const isInstructor = (user) => {
  if (!user) return false
  if (!user?.attributes?.profile?.publicData?.userType) return false
  return INSTRUCTOR_TYPES.includes(user.attributes.profile.publicData.userType.toLowerCase())
}
