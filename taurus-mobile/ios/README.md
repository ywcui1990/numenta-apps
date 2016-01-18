## Build instructions

### System Requirements:
- Mac OS X `10.10+`
- `XCode 7+` with `iOS 8+` SDK

### Dependencies:

The project dependencies are maintained using `cocoapods`. You must install `cocoapods` using the following command:

    sudo gem install cocoapods

Once `cocoapods` is installed you can run `run_pipeline.sh` to create project workspace, install all dependencies and build the app.

Add new dependencies to `Podfile` as required.

### Environment Variables:

You must specify the following environment variables:

- `COGNITO_POOL_ID`: Taurus uses the Amazon Cognito Identity service and AWS Security Token Service to create temporary, short-lived sessions to use for authentication. Enter the Cognito Identity Pool ID here. Something like this: `us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- `GA_TRACKING_ID`: Google Analytics Tracking ID, something like this: `UA-xxxxxxxx-x`
- `IOS_PROVISIONING_PROFILE`: iOS Provisioning Profile Name, something like this: `iOS Wildcard - Beta Test`

### IDE

Open `taurus.xcworkspace` from `XCode` and start developing. This workspace is composed of the `taurus` projects and its `Pods` or dependencies.
