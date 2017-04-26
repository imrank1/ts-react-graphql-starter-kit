import { SagaIterator } from 'redux-saga';
import { call, put, takeLatest, take, fork, select } from 'redux-saga/effects';
import { delay } from 'redux-saga'
import {
  ActionTypes,
  GuessSubmittedAction,
  answerChanged,
  goodGuessOccurred,
  badGuessOccurred,
  gameWon
} from '../actions'
import { State } from '../state'

import { graphqlClient } from '../graphql-client';
import gql from 'graphql-tag';

import { Answer } from '../../graphql/types';

export async function foo(x: number): Promise<string> {
  console.log("called me")
  return "Howdy!";
}

export function* callAFunctionSaga(): SagaIterator {
  const x: string = yield call(foo, 3);
  yield call(delay, 100);
  yield put({ type: 'gotResult', value: x });
}

export async function fetchAnswers(): Promise<Answer> {
  const result = await graphqlClient.query<{ answer: Answer }>({
    query: gql`{ answer }`,
    fetchPolicy: "network-only"
  });

  return result.data.answer;
}

export function* gameSaga(): SagaIterator {
  while (true) {
    let guessedRight = false;
    const newAnswer = yield call(fetchAnswers)
    yield put(answerChanged(newAnswer))

    while (!guessedRight) {
      let currentGuess = 0;

      const rightAnswer: Answer = yield select(State.answerSequence);
      for (; currentGuess < rightAnswer.length; currentGuess++) {
        const guess: GuessSubmittedAction = yield take(ActionTypes.GUESS_SUBMITTED);
        if (guess.value === rightAnswer[currentGuess]) {
          yield put(goodGuessOccurred(guess.value));
        } else {
          yield put(badGuessOccurred(guess.value));
          break;
        }
      }
      if (currentGuess === rightAnswer.length) {
        yield put(gameWon(rightAnswer));
        guessedRight = true;
      }
    }
  }
}

export function* rootSaga(): SagaIterator {
  yield fork(gameSaga);
}