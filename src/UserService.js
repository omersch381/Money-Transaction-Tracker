import React from "react";
import axios from "axios";

const ALL_USERS_GET_API_URL =
  "http://localhost:8084/dts/admin/users/adminTempSpace/adminTempEmail";

const GET_SPECIFIC_USER_API_URL = "http://localhost:8084/dts/users/login";

class UserService {
  getAllUsers() {
    return axios.get(ALL_USERS_GET_API_URL);
  }

  getSingleUser(id) {
    return axios.get(GET_SPECIFIC_USER_API_URL + id);
  }
}

export default new UserService();
