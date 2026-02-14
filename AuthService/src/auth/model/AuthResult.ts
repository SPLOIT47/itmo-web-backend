import {UserPayload} from "../payload/UserPayload";
import {Tokens} from "./Tokens";

export interface AuthResult {
    user: UserPayload,
    tokens: Tokens,
}