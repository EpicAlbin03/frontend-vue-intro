// ═══ Student Dashboard — Vue App (Options API) ═══
const { createApp, ref, computed, onMounted } = Vue

const API_URL = "http://localhost:8000/api"
const USER_STORAGE_KEY = "studentplatform_user"

createApp({
  setup() {
    let username = ref("")
    let password = ref("")
    let isLoggedIn = ref(false)
    let loginError = ref("")
    let user = ref({
      username: "",
      access_token: "",
      refresh_token: "",
    })

    let students = ref([])
    let studentsError = ref("")
    let isLoading = ref(false)
    let searchTerm = ref("")
    let sortStudentsOption = ref("name")

    let courses = ref([])
    let isLoadingCourses = ref(false)
    let coursesError = ref("")

    let newName = ref("")
    let newEmail = ref("")
    let newGrade = ref("")
    let newCourseId = ref(-1)

    function getGradeSortValue(grade) {
      const normalizedGrade = grade.trim().toUpperCase()
      const baseGradeValues = {
        A: 0,
        B: 3,
        C: 6,
        D: 9,
        F: 12,
      }

      const baseGrade = normalizedGrade[0]
      const modifier = normalizedGrade[1] ?? ""
      const baseValue = baseGradeValues[baseGrade]

      if (baseValue === undefined) {
        return Number.MAX_SAFE_INTEGER
      }
      if (baseGrade === "F") {
        return baseValue
      }
      if (modifier === "+") {
        return baseValue
      }
      if (modifier === "-") {
        return baseValue + 2
      }
      return baseValue + 1
    }

    const filteredStudents = computed(() => {
      const normalizedSearchTerm = searchTerm.value.trim().toLowerCase()
      const matchingStudents = normalizedSearchTerm
        ? students.value.filter((student) =>
            student.name.toLowerCase().includes(normalizedSearchTerm),
          )
        : students.value

      if (sortStudentsOption.value === "name") {
        return matchingStudents.sort((a, b) => a.name.localeCompare(b.name))
      }

      if (sortStudentsOption.value === "grade") {
        return matchingStudents.sort((a, b) => {
          const gradeDifference = getGradeSortValue(a.grade) - getGradeSortValue(b.grade)
          if (gradeDifference === 0) {
            return a.name.localeCompare(b.name)
          }
          return gradeDifference
        })
      }

      return matchingStudents
    })

    const currentUsername = computed(() => {
      return user.value.username
    })

    // ═══ Auth ═══

    function getStoredUser() {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (!storedUser) {
        return null
      }
      return JSON.parse(storedUser)
    }

    function setStoredUser(newUser) {
      user.value = newUser
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
    }

    function getToken() {
      return user.value.access_token
    }

    async function handleLogin() {
      loginError.value = ""

      const res = await fetch(`${API_URL}/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
      })

      if (!res.ok) {
        loginError.value = "Invalid credentials"
        return
      }

      const data = await res.json()
      setStoredUser({
        username: username.value,
        access_token: data.access,
        refresh_token: data.refresh,
      })
      username.value = ""
      password.value = ""
      isLoggedIn.value = true
      loadStudents()
      loadSelectCourses()
    }

    async function logout() {
      localStorage.removeItem(USER_STORAGE_KEY)
      user.value = {
        username: "",
        access_token: "",
        refresh_token: "",
      }
      students.value = []
      studentsError.value = ""
      courses.value = []
      coursesError.value = ""
      isLoggedIn.value = false
    }

    // ═══ Students ═══

    async function loadStudents() {
      isLoading.value = true
      studentsError.value = ""
      const token = getToken()

      const res = await fetch(`${API_URL}/students/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        studentsError.value = "Failed to load students"
        isLoading.value = false
        return
      }

      students.value = await res.json()
      isLoading.value = false
    }

    async function loadSelectCourses() {
      isLoadingCourses.value = true
      coursesError.value = ""
      const token = getToken()

      const res = await fetch(`${API_URL}/courses/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        coursesError.value = "Failed to load courses"
        return
      }

      courses.value = await res.json()
      console.log(courses.value)
      isLoadingCourses.value = false
    }

    function getStudentsInCourse(courseId) {
      return students.value.filter((student) => student.course === courseId)
    }

    async function addStudent() {
      studentsError.value = ""
      const token = getToken()

      const res = await fetch(`${API_URL}/students/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.value,
          email: newEmail.value,
          grade: newGrade.value,
          course: newCourseId.value,
        }),
      })

      if (!res.ok) {
        studentsError.value = "Failed to create student"
        return
      }

      const newStudent = await res.json()
      students.value.push(newStudent)
      newName.value = ""
      newEmail.value = ""
      newGrade.value = ""
      newCourseId.value = -1
      loadStudents()
    }

    async function deleteStudent(id) {
      studentsError.value = ""
      const token = getToken()

      const res = await fetch(`${API_URL}/students/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        studentsError.value = "Failed to delete student"
        return
      }

      students.value = students.value.filter((student) => student.id !== id)
    }

    function decodeJwtPayload(token) {
      try {
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
        return JSON.parse(atob(paddedBase64))
      } catch {
        return null
      }
    }

    function isTokenExpired(token) {
      const payload = decodeJwtPayload(token)

      if (!payload?.exp) {
        return true
      }

      return payload.exp * 1000 <= Date.now()
    }

    onMounted(() => {
      const storedUser = getStoredUser()

      if (!storedUser?.access_token) {
        logout()
        return
      }

      if (isTokenExpired(storedUser.access_token)) {
        logout()
        alert("Session expired. Please log in again.")
        return
      }

      user.value = storedUser
      isLoggedIn.value = true
      loadStudents()
      loadSelectCourses()
    })

    return {
      username,
      currentUsername,
      password,
      isLoggedIn,
      loginError,
      students,
      studentsError,
      isLoading,
      searchTerm,
      sortStudentsOption,
      courses,
      isLoadingCourses,
      coursesError,
      newName,
      newEmail,
      newGrade,
      newCourseId,
      filteredStudents,
      handleLogin,
      logout,
      loadStudents,
      addStudent,
      deleteStudent,
      getStudentsInCourse,
    }
  },
}).mount("#app")
