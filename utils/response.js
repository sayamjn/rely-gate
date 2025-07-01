class ResponseFormatter {
  static success(data = null, message = 'Operation completed successfully', count = null) {
    const response = {
      responseCode: 'S',
      responseMessage: message
    };
    
    if (data !== null) response.data = data;
    if (count !== null) response.count = count;
    
    return response;
  }

  static error(message = 'Operation failed', code = 'E') {
    return {
      responseCode: code,
      responseMessage: message
    };
  }

  static exists(message = 'Record already exists') {
    return {
      responseCode: 'F', 
      responseMessage: message
    };
  }

  static mobileExists(message = 'Mobile number is already registered') {
    return {
      responseCode: 'X',
      responseMessage: message
    };
  }
}

module.exports = ResponseFormatter