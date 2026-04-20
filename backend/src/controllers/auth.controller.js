import { AuthService } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";

/**
 * controllers/auth.controller.js
 *
 * Handles HTTP requests for registration and login.
 */

export const register = async (req, res, next) => {
    try {
        const { businessName, email, password } = req.body;

        if (!businessName || !email || !password) {
            throw new AppError("VALIDATION_ERROR", "Business name, email, and password are required", 400);
        }

        const result = await AuthService.register(businessName, email, password);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError("VALIDATION_ERROR", "Email and password are required", 400);
        }

        const result = await AuthService.login(email, password);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
