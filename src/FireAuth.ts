import * as admin from 'firebase-admin';
import { ServiceContext, Errors } from 'typescript-rest';

/**
 * Add Firebase authentication to a route
 *
 * @param target The prototype of the class
 * @param propertyKey The name of the method
 * @param descriptor The descriptor
 */
export function FireAuth() {
    return function (target: any, propertyKey: string, descriptor: any) {
        //can't get this working due to typescript-rest marking all arguments as objects...
        // let isDecodedToken = function (object: any): object is admin.auth.DecodedIdToken {
        //     return true;
        // }

        //save original method.
        const originalMethod = descriptor.value;
        let serviceContext: ServiceContext;
        let auth: admin.auth.Auth;
        descriptor.value = function () {
            return new Promise<any>((resolve, reject)=>{
                //get typescript-rest servicecontext from controller instance.
                for (let propName in this){
                    if (this[propName].constructor.name === "ServiceContext"){
                        serviceContext = this[propName];
                    }
                }
                //get Firebase auth from controller instace.
                for (let propName in this){
                    if (this[propName].constructor.name === "Auth"){
                        auth = this[propName];
                    }
                }
                if (serviceContext && serviceContext.request) {
                    let bearerToken = serviceContext.request.get('Authorization');
                    if (bearerToken && ~bearerToken.indexOf('Bearer')) {
                        auth.verifyIdToken(bearerToken.split(' ')[1])
                            .then((decodedToken: admin.auth.DecodedIdToken) => {
                                //load token argument, if exists.
                                // for (var i=0;i<arguments.length;i++){
                                //     if (isDecodedToken(arguments[i])){
                                //         arguments[i] = decodedToken;
                                //     }
                                // }

                                //token is valid. 
                                //run original method.
                                var result = originalMethod.apply(this, arguments);
                                resolve(result);
                            })
                            .catch((err) => {
                                //token is invalid. reject.
                                reject(new Errors.UnauthorizedError('Invalid Firebase token.'));
                            })
                    } else {
                        reject(new Errors.UnauthorizedError('Authentication required for this endpoint.'));
                    }
                } else {
                    reject(new Errors.InternalServerError());
                }
            });
        };
        return descriptor;
    }
  }