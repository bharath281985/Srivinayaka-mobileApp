const { withAndroidManifest, withSettingsGradle } = require('@expo/config-plugins');

const UPI_SCHEMES = [
  'upi',
  'tez',
  'phonepe',
  'paytm',
  'gpay',
  'bhim',
  'kiwi',
  'paytmmp',
  'credpay',
];

/**
 * Declares the UPI app schemes that the payment WebView hands to Linking.
 * Android 11+ uses this package-visibility declaration when resolving them.
 */
module.exports = function withUpiQueries(config) {
  config = withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    manifest.queries = manifest.queries || [];

    const queries = manifest.queries[0] || { intent: [] };
    queries.intent = queries.intent || [];

    const declaredSchemes = new Set(
      queries.intent.flatMap((intent) =>
        (intent.data || []).map((data) => data.$?.['android:scheme'])
      )
    );

    UPI_SCHEMES.filter((scheme) => !declaredSchemes.has(scheme)).forEach((scheme) => {
      queries.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        category: [{ $: { 'android:name': 'android.intent.category.BROWSABLE' } }],
        data: [{ $: { 'android:scheme': scheme } }],
      });
    });

    if (!manifest.queries[0]) manifest.queries.push(queries);
    return androidConfig;
  });

  return withSettingsGradle(config, (androidConfig) => {
    const marker = '// Keep autolinking valid after this project is moved.';
    if (androidConfig.modResults.contents.includes(marker)) return androidConfig;

    const cacheInput = `${marker}\ndef autolinkingProjectPath = new File(rootDir, 'build/generated/autolinking/project-path.txt')\nautolinkingProjectPath.parentFile.mkdirs()\nautolinkingProjectPath.text = rootDir.parentFile.canonicalPath\n`;
    androidConfig.modResults.contents = androidConfig.modResults.contents.replace(
      'extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->',
      `${cacheInput}\nextensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->`
    ).replace(
      'ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)',
      "ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand, rootDir.parentFile, files('../yarn.lock', '../package-lock.json', '../package.json', '../react-native.config.js', autolinkingProjectPath))"
    );
    return androidConfig;
  });
};
