// ═══ Student Dashboard — Vue App (Options API) ═══

const API_URL = "http://localhost:8000/api";

Vue.createApp({

    data() {
        return {
            // ═══ Auth ═══
            // TODO: username, password, isLoggedIn, loginError

            // ═══ Students ═══
            // TODO: students (array), isLoading (boolean), searchTerm (string)

            // ═══ New Student Form ═══
            // TODO: newName, newEmail, newGrade, newCourseId
        };
    },

    computed: {
        // TODO: filteredStudents — return students filtered by searchTerm
        // If searchTerm is empty, return all students
        // Otherwise filter where name includes searchTerm (case-insensitive)
    },

    methods: {
        // ═══ Auth ═══

        // TODO: handleLogin()
        // POST to API_URL + "/token/" with username and password
        // If successful: store token in localStorage, set isLoggedIn = true, call this.loadStudents()
        // If failed: set loginError message

        // TODO: logout()
        // Clear localStorage, set isLoggedIn = false

        // ═══ Students ═══

        // TODO: loadStudents()
        // GET from API_URL + "/students/" with Authorization header
        // Set this.students with the response
        // Handle isLoading state

        // TODO: addStudent()
        // POST to API_URL + "/students/" with form data
        // Clear the form fields after success
        // Call this.loadStudents() to refresh

        // TODO: deleteStudent(id)
        // DELETE to API_URL + "/students/" + id + "/"
        // Remove from this.students array after success

        // ═══ Helper ═══

        getToken() {
            return localStorage.getItem("access_token");
        }
    },

    mounted() {
        // TODO: check if a token exists in localStorage
        // If yes: set isLoggedIn = true and call this.loadStudents()
    }

}).mount("#app");
