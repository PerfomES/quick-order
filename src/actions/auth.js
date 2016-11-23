import { database } from '../firebase/firebase-app';
import { auth } from '../firebase/firebase-app';
import { listenToGoodsGroups } from './goods-groups-firebase';
import { listenToGoods } from './goods-firebase';
import { listenToPrices } from './prices-firebase';
import { listenToOrdersHeaders, listenToOrdersItems } from './orders-firebase';
import { setModal } from './../lib/modal/actions/modal';
import { setCustomer } from './customer';
import { setCurrentContent } from './current-content';

export const listenToAuth = () => {
	return (dispatch, getState) => {
		auth.onAuthStateChanged((authData) => {
			dispatch({type: 'RESET_ORDERS_HEADERS'});
			dispatch({type: 'RESET_ORDERS_ITEMS'});
			dispatch({type: 'RESET_CUSTOMER'});
			dispatch({type: 'RESET_QTY_PAGES_ORDERS'});
			dispatch(setCurrentContent('goods'));
			if (authData) {
				dispatch(setModal({ content: ''}));
				dispatch({
					type: 'AUTH_LOGIN',
					uid: authData.uid,
					username: authData.displayName,
					email: authData.email
				});
				//here listen to some data from firebase
				dispatch(listenToGoodsGroups());
				dispatch(listenToGoods());
				dispatch(listenToPrices());
    		if (authData.email) {
    			//get customer guid
    			const email = authData.email.replace('.', '%2E');
  				let usersRef  = database.ref(`users/${email}`);
  				usersRef.once('value', snapshot => {
  					let customerGuid = snapshot.val();
  					let customerRef = database.ref(`customers/${customerGuid}`);
  					customerRef.once('value', snapshot => {
  						const customerData = snapshot.val();
  						const { guid, description, address, phone, email, inn } = customerData;
  						dispatch(setCustomer(guid, description, address, phone, email, inn));
  						dispatch(listenToOrdersHeaders());
  						dispatch(listenToOrdersItems());
  					});
  				});
    		}
			} else {
				if (getState().auth.status !== 'AUTH_ANONYMOUS') {
					dispatch({ type: 'AUTH_LOGOUT' });
				}
			}
		});
	};
};

export const openAuth = ( credentials = '') => {
	return (dispatch) => {
		dispatch({ type: 'AUTH_OPEN' });
		if (credentials) {
			auth.signInWithEmailAndPassword(credentials.email, credentials.password)
				.catch(function(error) {
		    		dispatch({
							type: 'AUTH_ERROR',
							error: error.message
						});
						dispatch({ type: 'AUTH_LOGOUT' });
				});
		} else {
    		dispatch({
					type: 'AUTH_ERROR',
					error: 'Не заданы данные пользователя'
				});
				dispatch({ type: 'AUTH_LOGOUT' });
		}
	};
};

export const openAuthAnonimously = ( credentials = '') => {
	return (dispatch) => {
		dispatch({ type: 'AUTH_OPEN' });
			auth.signInAnonymously()
				.catch(function(error) {
		    		dispatch({
							type: 'AUTH_ERROR',
							error: error.message
						});
						dispatch({ type: 'AUTH_LOGOUT' });
				});
	};
};

export const logoutUser = () => {
	return (dispatch) => {
		dispatch({ type: 'AUTH_LOGOUT' });
		auth.signOut();
		dispatch(setModal({ content: 'login', fullScreen: true,  showClose: false, style:{display: 'flex', justifyContent: 'center', alignItems: 'center'}}));
	};
};
