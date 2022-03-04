#!/usr/bin/env bash

BRANCHES=(
	feature/support-non-hour-long-min-and-max-times
	fix-resize-feature-for-react-17
	use-event-wrapper-while-dragging
	feature/add-default-behaviour-to-scroll-to-time
)

CURRENT_DATE=`date +%Y-%m-%dT%H-%M`
RELEASE_BRANCH=release/$CURRENT_DATE

echo "=> Did you bump package version? (y/N)"

read IS_VERSION_BUMPED

if [ "$IS_VERSION_BUMPED" != "y" ]
then
	echo "=> Exit"
	exit
fi

echo "=> Create release branch \"$RELEASE_BRANCH\""
git branch $RELEASE_BRANCH

echo "=> Checkout to the brahcn"
git checkout $RELEASE_BRANCH

echo "=> Stash changes"
git stash

echo "=> Merge all branches into the release one"
for branch in "${BRANCHES[@]}"
do
	echo "=> Merge branch $branch into the release one"
	git merge --no-edit $branch
done

echo "=> Pop changes"
git stash pop

echo "=> Remove dist/ and lib/ folders"
rm -rf dist/ lib/

echo "=> Build and publish package"
npm publish --access public

echo "=> Done"
