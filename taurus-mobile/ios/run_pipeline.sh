# Install Pods
pod install

# Update AWS Cognito Pool ID
sed -i .bak -e s/\"\"/\"${COGNITO_POOL_ID}\"/g src/app/AppConfig.swift
rm src/app/AppConfig.swift.bak

# Update build number
BUILD_NUMBER=`git rev-list HEAD --count .`
agvtool new-version -all 1.0.${BUILD_NUMBER}

# Build Taurus mobile
xcodebuild clean build archive -workspace taurus.xcworkspace -scheme Taurus -configuration Release -archivePath build/taurus.xcarchive
rm Taurus.ipa
xcodebuild -exportArchive -exportPath Taurus -exportFormat ipa -exportProvisioningProfile "${IOS_PROVISIONING_PROFILE}"  -archivePath build/taurus.xcarchive

