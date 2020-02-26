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
        //save original method.
        const originalMethod = descriptor.value;

        let serviceContext: ServiceContext;
        descriptor.value = function () {
            return new Promise<any>((resolve, reject)=>{
                console.log(this);
                //get context from controller instance.
                serviceContext = this.context;
                if (serviceContext) {
                    let bearerToken = serviceContext.request.get('Authorization');
                    if (bearerToken && ~bearerToken.indexOf('Bearer')) {
                        admin.auth().verifyIdToken(bearerToken.split(' ')[1])
                            .then(() => {
                                //token is valid. run original method.
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