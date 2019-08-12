import * as React from 'react';
import * as BaseActions from './BaseActions';
import NavigationContext from './NavigationContext';
import { NavigationStateContext } from './NavigationContainer';
import { NavigationEventEmitter } from './useEventEmitter';
import {
  NavigationHelpers,
  NavigationProp,
  NavigationAction,
  NavigationState,
  ParamListBase,
  Router,
} from './types';

type Options<State extends NavigationState, Action extends NavigationAction> = {
  onAction: (
    action: NavigationAction,
    visitedNavigators?: Set<string>
  ) => boolean;
  getState: () => State;
  setState: (state: State) => void;
  emitter: NavigationEventEmitter;
  router: Router<State, Action>;
};

/**
 * Navigation object with helper methods to be used by a navigator.
 * This object includes methods for common actions as well as methods the parent screen's navigation object.
 */
export default function useNavigationHelpers<
  State extends NavigationState,
  Action extends NavigationAction
>({ onAction, getState, setState, emitter, router }: Options<State, Action>) {
  const parentNavigationHelpers = React.useContext(NavigationContext);
  const { performTransaction } = React.useContext(NavigationStateContext);

  return React.useMemo(() => {
    const dispatch = (action: Action | ((state: State) => State)) => {
      performTransaction(() => {
        if (typeof action === 'function') {
          setState(action(getState()));
        } else {
          onAction(action);
        }
      });
    };

    const actions = {
      ...router.actionCreators,
      ...BaseActions,
    };

    const helpers = Object.keys(actions).reduce(
      (acc, name) => {
        // @ts-ignore
        acc[name] = (...args: any) => dispatch(actions[name](...args));
        return acc;
      },
      {} as { [key: string]: () => void }
    );

    return {
      ...parentNavigationHelpers,
      ...helpers,
      dispatch,
      emit: emitter.emit,
      isFocused: parentNavigationHelpers
        ? parentNavigationHelpers.isFocused
        : () => true,
      canGoBack: () =>
        router.canGoBack(getState()) ||
        (parentNavigationHelpers && parentNavigationHelpers.canGoBack()) ||
        false,
    } as NavigationHelpers<ParamListBase> &
      (NavigationProp<ParamListBase, string, any, any, any> | undefined);
  }, [
    router,
    getState,
    parentNavigationHelpers,
    emitter.emit,
    performTransaction,
    setState,
    onAction,
  ]);
}
