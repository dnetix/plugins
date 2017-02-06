# [Valve Fingerprintjs2](https://github.com/Valve/fingerprintjs2)

## Usage
Run this code after the initialization of the contents are fully completed, just like jQuery's ready method

```js
new Fingerprint2().get(function(result, components){
  console.log(result); //a hash, representing your device fingerprint
  console.log(components); // an array of FP components
});
```