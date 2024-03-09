# Python Venv Project Template

1. Create a directory

    ```shell
    mkdir project
    touch project/requirements.txt
    ```


2. Create a Makefile in the directory

    ```makefile
    SHELL=/bin/bash

    PROJECT_DIR=.
    VENV_DIR=${PROJECT_DIR}/venv
    PYTHON3_BIN=${VENV_DIR}/bin/python3

    venv-freeze:
        $(PYTHON3_BIN) -m pip freeze > ${PROJECT_DIR}/requirements.txt

    cleanup-venv:
        rm -rf ${VENV_DIR}

    prepare-venv:
        python3 -m venv ${VENV_DIR}
        source ${VENV_DIR}/bin/activate
        $(PYTHON3_BIN) -m pip install -r ${PROJECT_DIR}/requirements.txt
        @echo
        @echo "=============================================="
        @echo 'use the following statements to activate venv:'
        @echo
        @echo 'source ${VENV_DIR}/bin/activate'
        @echo "=============================================="

    ```

3. Use VSCode to open the directory

    ```shell
    code project
    ```

4. Change the python interpreter of VSCode to the venv folder: `$(pwd)/venv/`

5. Re-enter the VSCode terminal, the venv should be activated automatically.
