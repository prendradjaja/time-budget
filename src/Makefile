run:
	npm run build
	cat ../dist/index.js | pbcopy

copy-last:
	make run

test:
	npm run build
	TEST=true node ../dist/index.js
