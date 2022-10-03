/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
import { loadStripe } from '@stripe/stripe-js';
const Stripe = require('stripe');

// get the checkoutsession from api on the client side
export const bookTour = async (tourId) => {
  try {
    const stripe = await loadStripe(
      'pk_test_51Lo9ZmI01EQwN3reH5NNC01I3gj5Xw8NOOQNyA3RGlbRoBszgRXMGrxvs8Y7iCA2vnJeKnVhnncv3sutLjFFAn9Q00ZcYZdfMr'
    );

    // get session from server
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    // create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
