// import https from 'https';

// export const handler = async (event) => {
//   const url = event.url;
//   const startTime = Date.now();
  
//   return new Promise((resolve, reject) => {
//     https.get(url, (res) => {
//       const endTime = Date.now();
//       const responseTime = endTime - startTime;
      
//       resolve({
//         statusCode: res.statusCode,
//         responseTime,
//         isUp: res.statusCode >= 200 && res.statusCode < 300
//       });
//     }).on('error', (error) => {
//       reject({
//         isUp: false,
//         error: error.message
//       });
//     });
//   });
// };
