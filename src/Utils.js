export function wwwencode_partial(data) { 
//  return btoa(JSON.stringify(data));
  return JSON.stringify(data);
} 

export function wwwdecode(data) { 
//  return JSON.parse(atob(decodeURIComponent(data)));
  return JSON.parse(decodeURIComponent(data));
}

export function wwwencode_form(body) {
  var formBody = [];
  for (var property in body) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(body[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  console.log(formBody);
  return formBody;
}
