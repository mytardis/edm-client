/**
 * Created by grischa on 14/07/2016.
 *
 * To support proxies, we first need to get the settings from the system
 * or environment.
 * Then we need to provide an agent that uses the settings and use that in a
 * custom network layer for Apollo
 */


/** environment variables, cross platform
 */

if (process.env.hasOwnProperty("http_proxy") ||
    process.env.hasOwnProperty("https_proxy")) {
    let http_proxy = process.env.http_proxy || '';
    let https_proxy = process.env.https_proxy || '';
}

// need to detect OS here and adjust actions accordingly

/**
 * Windows Internet Settings from Registry
*/
// let hive = Registry.HKCU;  // "HKEY_CURRENT_USER"
// let key = "\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";

/**
 * Example entries
 *
    ProxyEnable    REG_DWORD 0x1
    ProxyServer    REG_SZ    proxyhost:8080
    ProxyOverride  REG_SZ    <local>
    AutoConfigURL  REG_SZ    file:///Users/Administrator/Desktop/proxy-test.pac

    ProxyEnable    REG_DWORD 0x0
    ProxyServer    REG_SZ    http=proxyhost:8080;https=proxyhostsecure:8081;ftp=proxyhost:8080;socks=socksproxy:1234
    ProxyOverride  REG_SZ    monash;<local>
 */

// import * as Registry from "winreg";
// let regKey = new Registry({ hive: hive, key: key });
//
// function parseProxySettings(item: Registry.RegistryItem) {
//     switch (item.name) {
//         case "ProxyEnable":
//             let proxyEnable = item.value;
//             break;
//         case "ProxyServer":
//             let proxyServer = item.value;
//             break;
//         case "ProxyOverride":
//             let proxyOverride = item.value;
//             break;
//         case "AutoConfigURL":
//             let autoConfigURL = item.value;
//             break;
//     }
// }
//
// regKey.values(function (err, items) {
//     // items are array of RegistryItem
//     if (err)
//         console.log('ERROR: ' + err);  // needs proper handling
//     else {
//         items.forEach(parseProxySettings);
//     }
// });

/**
 * Windows newer proxy settings, not always in sync with registry above

 * Outputs from: netsh.exe winhttp show proxy

Current WinHTTP proxy settings:

    Proxy Server(s) :  proxyhost:8080
    Bypass List     :  <local>

Current WinHTTP proxy settings:

    Proxy Server(s) :  http=proxyhost:8080;https=proxyhostsecure:8081;ftp=proxyhost:8080;socks=socksproxy:1234
    Bypass List     :  monash;<local>
  */

// child_process.exec('netsh winhttp show proxy', cb);

/**
 * Patch http/requests library with proxy settings
 */
