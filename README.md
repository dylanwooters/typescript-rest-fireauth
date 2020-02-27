# :fire: typescript-rest-fireauth :fire:
Need to add Firebase token authentication to your typescript-rest project?

This project provides a `FireAuth` decorator that you can place on any API endpoint. It will guard the endpoint, verifying the Firebase ID token passed in with the Authorization header.

<!--- still working on this... --->
<!--- As an option, you can also pass in a `DecodedIdToken` as an argument in your controller method, which will be loaded with the [decoded Firebase ID token](https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken). --->

# Usage

## Installation

1. Make sure you have [typescript-rest](https://www.npmjs.com/package/typescript-rest) installed and that you have configured experimental decorators in your tsconfig.json file. Alternatively, you can use the typescript-rest [boilerplate](https://github.com/vrudikov/typescript-rest-boilerplate) project.
```
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

NOTE: This hasn't been published to npm yet. For now, you'll have to just clone the repo. Sorry :poop:

2. Then install typescript-rest-fireauth:
`npm install typescript-rest-fireauth`

## Step 2: Configuration

### Back-end

1. [Install and initialize](https://firebase.google.com/docs/admin/setup/) the Firebase Admin SDK

2. In your controller, add properties of type ServiceContext and admin.auth.Auth. These will be used to obtain request headers and verify the token.

```
import { GET, Path, Context, ServiceContext } from 'typescript-rest';
import * as admin from 'firebase-admin';

@Path('/user')
export class UserController {
  @Context
  private context: ServiceContext;
  private admin: admin.auth.Auth = admin.auth();
}

```

3. Add the `FireAuth` decorator to an endpoint that needs authentication.

```
import { FireAuth } from 'typescript-rest-fireauth';

/**
 * Retrieve a User.
 */
@FireAuth()
@Path('/details')
@GET
getUserDetails(@PathParam('id') id: string): Promise<User> {
    return new Promise<User>((resolve, reject)=>{
        this.myService.getUser(id)
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

```
GET /user/details HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer [token]
```
