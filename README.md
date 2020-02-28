# :fire: typescript-rest-fireauth :fire:
Need to add Firebase token authentication to your typescript-rest API?

This project provides a `FireAuth` decorator that you can place on any typescript-rest API endpoint. It will guard the endpoint, verifying the Firebase ID token passed in with the Authorization header.

As an option, you can also obtain the value of the [decoded Firebase ID token](https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken) for use within your controller.

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

Then, in your controller class, add the typescript-rest `ServiceContext` with the `@Context` decorator to your controller, and also instantiate a property of type `admin.auth.Auth`. These will be used to obtain request authorization headers and verify the token with Firebase. Also instantiate a property of type `DecodedToken` if you'd like to use the decoded Firebase ID token.

  ```
  import { GET, Path, PathParam, Context, ServiceContext } from 'typescript-rest';
  import * as admin from 'firebase-admin';
  import { FireAuth, DecodedToken } from 'typescript-rest-fireauth';

  @Path('/user')
  export class UserController {

    //required by typescript-rest-fireauth
    @Context
    private context: ServiceContext;
    private admin: admin.auth.Auth = admin.auth();
    
    //optional - use to obtain the decoded firebase id token 
    private decodedToken: DecodedToken = new DecodedToken();
  }

  ```

Finally, add the `FireAuth` decorator to an endpoint that requires authentication.

  ```
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

Optional: If you added the `DecodedToken` as a property on your controller, it will be loaded with the [decoded Firebase ID token](https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken) for the current request. 

  ```

  /**
  * Retrieve a User.
  */
  @FireAuth()
  @Path(':id')
  @GET
  getUser(@PathParam('id') id: string): Promise<User> {
      return new Promise<User>((resolve, reject)=>{
          console.log('user firebase uid is ' + this.decodedToken.uid);
          this.myService.getUserByUid(this.decodedToken.uid)
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

## Gotchas

If the properties required by typescript-rest-fireauth remain unread in your controller, you may receive an error upon build. You can resolve this by changing `noUnusedLocals` to false in your tsconfig.json.

## Release Notes

1.0.0 - Initial release.

1.1.0 - Switched from `Decode` parameter decorator to `DecodedToken` controller property in order to fulfill decoded Firebase ID token, because typescript-rest does not allow additional parameters in POST/PUT methods.
