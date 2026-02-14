import * as bcrypt from 'bcrypt'

export class TokenHasher {

    static hash(token: string): Promise<string> {
        return bcrypt.hash(token, 10);
    }

    static verify(token: string, hash: string): Promise<boolean> {
        return bcrypt.compare(token, hash);
    }
}