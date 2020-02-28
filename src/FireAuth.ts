import * as admin from 'firebase-admin';
import { ServiceContext, Errors } from 'typescript-rest';

const contextConstructorName = "ServiceContext";
const authConstructorName = "Auth";
const decodedConstructorName = "DecodedToken";

/**
 * Add Firebase authentication to a route
 *
 * @param target The prototype of the class
 * @param propertyKey The name of the method
 * @param descriptor The descriptor
 */
export function FireAuth() {
    return function (target: any, propertyKey: string, descriptor: any) {
        //save original method.
        const originalMethod = descriptor.value;
        let serviceContext: ServiceContext;
        let auth: admin.auth.Auth;
        let tokenPropName: string;
        descriptor.value = function () {
            return new Promise<any>((resolve, reject)=>{
                //get typescript-rest servicecontext,firebase auth, and decoded token from controller object.
                for (let propName in this){
                    if (this[propName].constructor.name === contextConstructorName){
                        serviceContext = this[propName];
                    }
                    if (this[propName].constructor.name === authConstructorName){
                        auth = this[propName];
                    }
                    if (this[propName].constructor.name === decodedConstructorName){
                        tokenPropName = propName;
                    }
                }
                if (serviceContext && auth) {
                    let bearerToken = serviceContext.request.get('Authorization');
                    if (bearerToken 
                        && ~bearerToken.indexOf('Bearer') 
                        && bearerToken.split(' ').length === 2
                        && bearerToken.split(' ')[1] !== ''
                        ) {
                        auth.verifyIdToken(bearerToken.split(' ')[1])
                            .then((decodedToken: admin.auth.DecodedIdToken) => {
                                //token is valid. 
                                //assign value of decoded token to controller prop
                                if (tokenPropName) {
                                    Object.assign(this[tokenPropName], decodedToken);
                                }

                                //run original method.
                                var result = originalMethod.apply(this, arguments);
                                resolve(result);
                            })
                            .catch((err) => {
                                //token is invalid, reject.
                                console.error(err.message);
                                reject(new Errors.UnauthorizedError('Invalid token.'));
                            })
                    } else {
                        //no bearer token sent, reject.`
                        reject(new Errors.UnauthorizedError('Bearer authentication is required for this endpoint.'));
                    }
                } else {
                    console.error('typescript-rest-fireauth error: Required controller properties not found. Did you add ServiceContext and admin.auth.Auth properties to your controller? See README.')
                    reject(new Errors.InternalServerError());
                }
            });
        };
        return descriptor;
    }
}

export class DecodedToken {
    public aud!: string;
    public auth_time!: number;
    public exp!: number;
    public firebase!: any;
    public iat!: number;
    public iss!: number;
    public sub!: string;
    public uid!: string;

    constructor(){};
}