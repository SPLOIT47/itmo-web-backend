import * as bcrypt from 'bcrypt'

export class PasswordHasher {

    static hash(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    static verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}