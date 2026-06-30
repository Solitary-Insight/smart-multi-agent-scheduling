const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// router.get("/", userController.getUsers);
router.get("/admins", userController.getAdmins);
router.post("/admins", userController.createAdmins);
router.put("/:id", userController.updateUser);   // ✅ ADD
router.delete("/:id", userController.deleteUser);
router.post("/login", userController.loginUser);
router.post("/check-auth", userController.checkAuth);
router.post("/logout", userController.logoutUser);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

module.exports = router;