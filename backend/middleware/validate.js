// Phone number validation: exactly 10 digits
const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);

const phoneValidationMiddleware = (req, res, next) => {
    const phone = req.body.phone;
    if (phone && !validatePhone(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Phone number must be exactly 10 digits (numeric only).'
        });
    }
    next();
};

module.exports = { validatePhone, phoneValidationMiddleware };
