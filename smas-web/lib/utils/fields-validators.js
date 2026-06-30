export const NotEmptyValidator = (field, onValidationFailed = () => { }) => {
  const isValid = field!=''
  if (!isValid) onValidationFailed();
  return isValid;
};
/**
 * Validates email format using regex
 */
export const EmailValidator = (email, onValidationFailed = () => { }) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = regex.test(email);
  if (!isValid) onValidationFailed();
  return isValid;
};

/**
 * Validates phone number (basic: digits only, 10–15 length)
 * Customize per country if needed
 */
export const PhoneValidator = (phone, onValidationFailed = () => { }) => {
  const regex = /^\+?[0-9]{10,15}$/;
  const isValid = regex.test(phone);
  if (!isValid) onValidationFailed();
  return isValid;
};

/**
 * Validates postal code (basic: 4–10 alphanumeric)
 * Customize regex based on country format
 */
export const PostalCodeValidator = (code, onValidationFailed = () => { }) => {
  const regex = /^[A-Za-z0-9\s\-]{4,10}$/;
  const isValid = regex.test(code);
  if (!isValid) onValidationFailed();
  return isValid;
};

/**
 * Checks if a string contains only digits
 */
export const AllDigitsValidator = (digitString, onValidationFailed = () => { }) => {
  const regex = /^\d+$/;
  const isValid = regex.test(digitString);
  if (!isValid) onValidationFailed();
  return isValid;
};
/**
* Validates a person's name.
* - Allows letters (Unicode supported for i18n)
* - Optional spaces, hyphens, apostrophes
* - Disallows consecutive special characters or leading/trailing symbols
*/
export const NameValidator = (name,
  onValidationFailed = () => { },
  options = { min: 2, max: 50 }
) => {
  const trimmed = name.trim();

  // Allow Unicode letters, space, hyphen, apostrophe
  const regex = /^(?!.*[-' ]{2,})[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[-' ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;

  const isValid =
    regex.test(trimmed) &&
    trimmed.length >= options.min &&
    trimmed.length <= options.max;

  if (!isValid) onValidationFailed();

  return isValid;
};


export const PasswordStrengthValidator = (
  password,
  confirmPassword,
  onValidationFailed = (message) => { }
) => {
  const MIN_LENGTH = 8;
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/;

  if (!password || !confirmPassword) {
    onValidationFailed("PASS_REQUIRED");
    return false;
  }

  if (password.length < MIN_LENGTH) {
    onValidationFailed(`PASS_MIN_LENGTH`);
    return false;
  }

  if (!strongRegex.test(password)) {
    onValidationFailed(
      "PASS_WEAK"
    );
    return false;
  }

  if (password !== confirmPassword) {
    onValidationFailed("PASS_MISMATCH");
    return false;
  }

  return true;
};


export const PasswordValidator = (
  password,
) => {
  const MIN_LENGTH = 8;
  if (password.length < MIN_LENGTH) {
    return false;
  }
  return true;
};




/**
 * Validates a non-empty farm name (basic: 2-100 characters, letters, numbers, spaces)
 */
export const FarmNameValidator = (name, onValidationFailed = () => { }) => {
  const trimmed = name.trim();
  const regex = /^[A-Za-z0-9\s\-']{2,100}$/;
  const isValid = regex.test(trimmed);
  if (!isValid) onValidationFailed();
  return isValid;
};

/**
 * Validates farm address (allows alphanumeric, comma, slash, dots, space)
 */
export const FarmAddressValidator = (address, onValidationFailed = () => { }) => {
  const trimmed = address.trim();
  const regex = /^[A-Za-z0-9\s,.\-\/#]{5,200}$/;
  const isValid = regex.test(trimmed);
  if (!isValid) onValidationFailed();
  return isValid;
};

/**
 * Validates city or state name (letters, spaces, hyphens)
 */
export const CityOrStateValidator = (text, onValidationFailed = () => { }) => {
  const trimmed = text.trim();
  const regex = /^[A-Za-z\s\-]{2,50}$/;
  const isValid = regex.test(trimmed);
  if (!isValid) onValidationFailed();
  return isValid;
};

/**
 * Validates postal code (reuses existing)
 */
export const FarmPostalCodeValidator = PostalCodeValidator;

/**
 * Validates cattle count (must be positive integer >= 1)
 */
export const CattleCountValidator = (count, onValidationFailed = () => { }) => {
  // const isValid = /^\d+$/.test(count) && parseInt(count) >= 1;
  console.log('count', count)
  if (count.length == 0) {
    onValidationFailed()
    return false
  };
  return true;
};

/**
 * Validates farm size (must be positive float or int, minimum 0.1 acre)
 */
export const FarmSizeValidator = (size, onValidationFailed = () => { }) => {
  const isValid = /^\d+(\.\d+)?$/.test(size) && parseFloat(size) >= 0.1;
  if (!isValid) onValidationFailed();
  return isValid;
};

/**
 * Validates selected farm type (dropdown: must be one of allowed values)
 */
export const FarmTypeValidator = (value, onValidationFailed = () => { }) => {
  // const allowed = ["Dairy", "Beef", "Mixed", "Other"];
  // const isValid = allowed.includes(value);
  // if (!isValid) onValidationFailed();
  // return isValid;
  if (value.length == 0) {
    onValidationFailed()
    return false
  };
  return true;
};


 



