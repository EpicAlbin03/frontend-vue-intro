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

    let courses = ref([])
    let isLoadingCourses = ref(false)
    let coursesError = ref("")

    let newName = ref("")
    let newEmail = ref("")
    let newGrade = ref("")
    let newCourseId = ref(-1)

    const filteredStudents = computed(() => {
      if (!searchTerm.value) {
        return students.value
      }
      return students.value.filter((student) =>
        student.name.toLowerCase().includes(searchTerm.value.toLowerCase()),
      )
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
      isLoadingCourses.value = false
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

    onMounted(() => {
      const storedUser = getStoredUser()

      if (storedUser?.access_token) {
        user.value = storedUser
        isLoggedIn.value = true
        loadStudents()
        loadSelectCourses()
      } else {
        logout()
      }
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
    }
  },
}).mount("#app")
