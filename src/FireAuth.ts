import * as admin from 'firebase-admin';
import { ServiceContext, Errors } from 'typescript-rest';

const decodeMetadataKey = Symbol("decodeIndex");

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
        descriptor.value = function () {
            return new Promise<any>((resolve, reject)=>{
                //get typescript-rest servicecontext from controller object.
                for (let propName in this){
                    if (this[propName].constructor.name === "ServiceContext"){
                        serviceContext = this[propName];
                    }
                }
                //get firebase auth from controller object.
                for (let propName in this){
                    if (this[propName].constructor.name === "Auth"){
                        auth = this[propName];
                    }
                }
                if (serviceContext && auth) {
                    let bearerToken = serviceContext.request.get('Authorization');
                    if (bearerToken && ~bearerToken.indexOf('Bearer')) {
                        auth.verifyIdToken(bearerToken.split(' ')[1])
                            .then((decodedToken: admin.auth.DecodedIdToken) => {
                                //token is valid. 

                                //find and load decodedToken object, if exists.
                                let decodeParamIndex: number = Reflect.getOwnMetadata(decodeMetadataKey, target, propertyKey);
                                if (decodeParamIndex) {
                                    arguments[decodeParamIndex] = decodedToken;
                                }

                                //run original method.
                                var result = originalMethod.apply(this, arguments);
                                resolve(result);
                            })
                            .catch((err) => {
                                //token is invalid, reject.
                                reject(new Errors.UnauthorizedError('Invalid Firebase token.'));
                            })
                    } else {
                        //no bearer token sent, reject.
                        reject(new Errors.UnauthorizedError('Authentication required for this endpoint.'));
                    }
                } else {
                    console.error('Required controller properties not found. Did you add ServiceContext and admin.auth.Auth properties to your controller? See README.')
                    reject(new Errors.InternalServerError());
                }
            });
        };
        return descriptor;
    }
}

export function Decode(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    Reflect.defineMetadata(decodeMetadataKey, parameterIndex, target, propertyKey);
    console.log('Added decode metadata');
}