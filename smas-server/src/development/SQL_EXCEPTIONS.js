const HttpStatusCodes=require("./HttpStatusCodes.js")

 class SqlException {

  static handle(error) {
    const { errno, code, sqlMessage } = error;
    console.log('[SQL-EXCEPTION-CATCH]', JSON.stringify(error.message))
    switch (errno) {
      case 1045:
        return {
          status: HttpStatusCodes.UNAUTHORIZED,
          message: "Access denied: Invalid database username or password.",
          code
        };

      case 1049:
        return {
          status: HttpStatusCodes.NOT_FOUND,
          message: "The specified database was not found.",
          code
        };

      case 1050:
        return {
          status: HttpStatusCodes.CONFLICT,
          message: "Table already exists in the database.",
          code
        };

      case 1051:
        return {
          status: HttpStatusCodes.NOT_FOUND,
          message: "Table not found in the database.",
          code
        };

      case 1054:
        return {
          status: HttpStatusCodes.BAD_REQUEST,
          message: "Unknown column specified in the query.",
          code
        };

      case 1062:
        return {
          status: HttpStatusCodes.CONFLICT,
          message: "Duplicate entry detected: a unique field already contains this value.",
          code
        };

      case 1064:
        return {
          status: HttpStatusCodes.BAD_REQUEST,
          message: "SQL syntax error: Please check your query format.",
          code
        };

      case 1091:
        return {
          status: HttpStatusCodes.BAD_REQUEST,
          message: "Cannot drop column or index that doesn’t exist.",
          code
        };

      case 1136:
        return {
          status: HttpStatusCodes.BAD_REQUEST,
          message: "Column count doesn't match the value count in the query.",
          code
        };

      case 1146:
        return {
          status: HttpStatusCodes.NOT_FOUND,
          message: "Table does not exist in the database.",
          code
        };

      case 1216:
        return {
          status: HttpStatusCodes.CONFLICT,
          message: "Foreign key constraint failed: no matching parent row found.",
          code
        };

      case 1217:
        return {
          status: HttpStatusCodes.CONFLICT,
          message: "Cannot delete or update row: it is still referenced by another table.",
          code
        };

      case 1366:
        return {
          status: HttpStatusCodes.UNPROCESSABLE_ENTITY,
          message: "Invalid value type for column. Check enum or type conversion.",
          code
        };

      case 1451:
        return {
          status: HttpStatusCodes.CONFLICT,
          message: "Cannot delete/update a row referenced in another table.",
          code
        };

      case 1452:
        return {
          status: HttpStatusCodes.CONFLICT,
          message: "Cannot insert/update: parent row does not exist for foreign key.",
          code
        };

      case 2002:
      case 2003:
        return {
          status: HttpStatusCodes.SERVICE_UNAVAILABLE,
          message: "Database server is unreachable or not running.",
          code
        };

      default:
        return {
          status: HttpStatusCodes.INTERNAL_SERVER_ERROR,
          message: sqlMessage || "An unknown database error occurred.",
          code
        };
    }
  }
}

module.exports=SqlException
