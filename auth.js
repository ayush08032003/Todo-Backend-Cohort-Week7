// const express = require("express");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  const token = req.headers.token;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded) {
      req.userId = decoded.userId;
      next();
    } else {
      res.status(401).json({
        message: "Unauthorized",
      });
    }
  } catch (e) {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

module.exports = { auth, JWT_SECRET };
