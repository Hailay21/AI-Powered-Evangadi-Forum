import { StatusCodes } from 'http-status-codes';

export const errorHandler = (err, req, res, next) => {
  const isKnown = typeof err.statusCode === 'number';
  const customError = {
    statusCode: isKnown ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR,
    msg: isKnown
      ? err.message
      : 'Something went wrong try again later',
  };

  if (err?.code === 'ER_DUP_ENTRY') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = 'Duplicate value entered for a unique field';
  }

  if (!isKnown) {
    console.error(err);
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};
