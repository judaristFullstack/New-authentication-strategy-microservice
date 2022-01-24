import { NextFunction, Request, Response } from "express";
import {verifySync, checkValidEmail} from "../libs/libs.js";
import {InvalidCredentials} from "../middlewares/Responses.js";
import { checkUserAuthentication } from "../middlewares/Authentication.js";
import user from "../models/user.js";
import config from "../config.js";

export default async function login (req:Request, res:Response, next:NextFunction) {
        // require required fields
        const required_fields = ["email", "password"];
        for (let i = 0; i <required_fields.length; i++) {
            if(!req.body[required_fields[i]]){
                return next(new Error(`${required_fields[i]} is required`));
            }
        }
        let isAuthenticated = await checkUserAuthentication(req);
        if (isAuthenticated === true ){
            // already logged
            return next(new Error("Authentication is already"));
        }
    
        if (! checkValidEmail(req.body.email) || req.body.password === ""){
            return InvalidCredentials(res);
        }
    
        // We hope to have the "email" and "password" fields in the body of the request
        let founded_user = await user.findOne({
            email : req.body.email
        }, "token email name password").exec();
    
        if (founded_user === null) {
            return res.status(400).json({
                error : true,
                message : "User not found"
            });
        }
        let verfied_password = null;
        try {
            verfied_password = verifySync(req.body.password, founded_user.password);
        }catch(err:any) {
            return next(err.message);
        }
        
        if (verfied_password === false) {
            return InvalidCredentials(res);
        }else if (verfied_password === true) {
            return res.status(200).cookie(
                config.user_token,  founded_user.token, {
                    maxAge : 31560000000 // A year !
                }
            ).json({
                success : true,
                data : founded_user
            });
        }else {
            return next(new Error("An exception occured :-(, please try again :-)"));
        }
}
