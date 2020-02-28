# :fire: typescript-rest-fireauth :fire:
Need to add Firebase token authentication to your typescript-rest API?

This project provides a `FireAuth` decorator that you can place on any typescript-rest API endpoint. It will guard the endpoint, verifying the Firebase ID token passed in with the Authorization header.

<!--- As an option, you can also apply the `Decode` decorator to an argument in a `FireAuth` method. The argument will then be loaded with the [decoded Firebase ID token](https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken). --->

# Usage

## Step 1: Installation

Make sure you have [typescript-rest](https://www.npmjs.com/package/typescript-rest) installed and that you have configured experimental decorators in your tsconfig.json file. Alternatively, you can use the typescript-rest [boilerplate](https://github.com/vrudikov/typescript-rest-boilerplate) project.
```
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Then install typescript-rest-fireauth:
`npm install typescript-rest-fireauth`

## Step 2: Configuration

### Back-end

The first step is to [install and initialize](https://firebase.google.com/docs/admin/setup/) the Firebase Admin SDK. Usually this is best done in the function that starts the server. If you're using the boilerplate project, this would be in `start.ts`.

Then, in your controller class, add properties of type ServiceContext and admin.auth.Auth. These will be used to obtain request authorization headers and verify the token with Firebase. (If these properties remain unread in your controller, you may receive an error upon build. You can resolve this by changing `noUnusedLocals` to false in your tsconfig.json.)

  ```
  import { GET, Path, PathParam, Context, ServiceContext } from 'typescript-rest';
  import * as admin from 'firebase-admin';

  @Path('/user')
  export class UserController {

    //required by typescript-rest-fireauth
    @Context
    private context: ServiceContext;
    private admin: admin.auth.Auth = admin.auth();
    //
  }

  ```

Finally, add the `FireAuth` decorator to an endpoint that requires authentication.

  ```
  import { FireAuth } from 'typescript-rest-fireauth';

  /**
  * Retrieve a User.
  */
  @FireAuth()
  @Path(':id')
  @GET
  getUser(@PathParam('id') id: string): Promise<User> {
      return new Promise<User>((resolve, reject)=>{
          this.myService.getUser(id)
            .then((user) => {
                resolve(user);
            })
            .catch((err) => reject(err));
      });
  }
  ```

(NOTE: the `Decode` decorator, below, is currently only working for GET endpoints, due to a typescript-rest limitation. I hope to have other requests types working soon in a future release.) 

Optional: Add the `Decode` decorator to a controller method argument, which will be loaded with the [decoded Firebase ID token](https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken). Note that this argument should be the last, after any `PathParam` arguments.

  ```
  import { FireAuth, Decode } from 'typescript-rest-fireauth';

  /**
  * Retrieve a User.
  */
  @FireAuth()
  @Path(':id')
  @GET
  getUser(@PathParam('id') id: string, @Decode decodedToken: any): Promise<User> {
      return new Promise<User>((resolve, reject)=>{
          console.log('user firebase uid is ' + decodedToken.uid);
          this.myService.getUserByUid(decodedToken.uid)
            .then((user) => {
                resolve(user);
            })
            .catch((err) => reject(err));
      });
  }
  ```

### Front-end

In your front-end app, requests to the `FireAuth` endpoints must include the Firebase ID token as a [Bearer token](https://swagger.io/docs/specification/authentication/bearer-authentication/) in the Authorization header.

Check out the [Google documentation](https://firebase.google.com/docs/auth/admin/verify-id-tokens#retrieve_id_tokens_on_clients) on obtaining Firebase ID tokens on the client side.

Here is a sample request:

```
GET /user/12345 HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer [firebase id token]
```
