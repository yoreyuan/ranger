/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, useContext } from "react";
import { Form as FormB, Modal, Button, Table, Badge } from "react-bootstrap";
import { Form, Field } from "react-final-form";
import Select from "react-select";
import arrayMutators from "final-form-arrays";
import { FieldArray } from "react-final-form-arrays";
import {
  groupBy,
  keys,
  indexOf,
  findIndex,
  isEmpty,
  includes,
  difference
} from "lodash";
import { RangerPolicyType } from "Utils/XAEnums";
import { Context } from "./AddUpdatePolicyForm";

export default function TagBasePermissionItem(props) {
  const { options, inputVal, formValues, serviceCompDetails, dataMaskIndex } =
    props;
  const [showTagPermissionItem, tagPermissionItem] = useState(false);
  const context = useContext(Context);

  const msgStyles = {
    background: "white",
    color: "black"
  };

  const noOptionMsg = (inputValue) => {
    if (
      formValues?.policyType ==
      RangerPolicyType.RANGER_MASKING_POLICY_TYPE.value
    ) {
      if (!inputValue) {
        return " You can only select 1 item";
      } else {
        return "No results found";
      }
    } else {
      return "No Options";
    }
  };

  const tagServicePerms = groupBy(options, function (obj) {
    let val = obj.value;
    return val.substr(0, val.indexOf(":"));
  });

  const handleSubmit = (values) => {
    let tagPermissionType = values;
    delete tagPermissionType.servicesDefType;
    if (values?.tableList) {
      tagPermissionType.tableList = values.tableList.filter((m) => {
        if (m.permission) {
          if (!isEmpty(m.permission)) {
            return m;
          } else {
            m.serviceName = "";
            if (
              serviceCompDetails?.name == "tag" &&
              formValues?.policyType ==
                RangerPolicyType.RANGER_MASKING_POLICY_TYPE.value &&
              formValues?.dataMaskPolicyItems[dataMaskIndex]?.dataMaskInfo
            ) {
              formValues.dataMaskPolicyItems[dataMaskIndex].dataMaskInfo = {};
            }
          }
        }
      });
    }
    inputVal.onChange(tagPermissionType);
    handleClose();
  };

  const handleClose = () => {
    tagPermissionItem(false);
  };

  const serviceOnChange = (e, input, values, push, remove) => {
    if (e.action == "select-option") {
      push("tableList", {
        serviceName: e.option.value
      });
    } else {
      let removeItemIndex = findIndex(input.value, [
        "value",
        e?.removedValue?.value
      ]);
      remove("tableList", removeItemIndex);
      if (
        serviceCompDetails?.name == "tag" &&
        formValues?.policyType ==
          RangerPolicyType.RANGER_MASKING_POLICY_TYPE.value &&
        formValues?.dataMaskPolicyItems[dataMaskIndex]?.dataMaskInfo
      ) {
        formValues.dataMaskPolicyItems[dataMaskIndex].dataMaskInfo = {};
      }
    }
    input.onChange(values);
  };

  const selectOptions = (values) => {
    if (
      formValues?.policyType ==
      RangerPolicyType.RANGER_MASKING_POLICY_TYPE.value
    ) {
      if (values?.tableList?.length > 0) {
        return [];
      } else {
        return keys(tagServicePerms).map((m) => ({
          value: m,
          label: m.toUpperCase()
        }));
      }
    } else {
      let enableDenyAndExceptions = [];
      let filterAccessOptions = [];
      enableDenyAndExceptions = serviceCompDetails?.accessTypes?.filter(
        (access) => {
          if (
            includes(
              context?.serviceDefs
                ?.map((servicedef) => {
                  if (
                    servicedef?.options?.enableDenyAndExceptionsInPolicies ==
                    "false"
                  ) {
                    return servicedef.name;
                  }
                })
                .filter(Boolean),
              access.name.substr(0, access.name.indexOf(":"))
            )
          ) {
            return access;
          }
        }
      );
      filterAccessOptions = groupBy(enableDenyAndExceptions, function (obj) {
        let val = obj.name;
        return val.substr(0, val.indexOf(":"));
      });
      return difference(keys(tagServicePerms), keys(filterAccessOptions))?.map(
        (m) => ({
          value: m,
          label: m.toUpperCase()
        })
      );
    }
  };

  const isChecked = (obj, input) => {
    let selectedVal = input.value || [];
    return indexOf(selectedVal, obj) !== -1;
  };

  const isAllChecked = (fieldObj, objVal) => {
    return (
      !!fieldObj?.permission &&
      fieldObj?.permission?.length > 0 &&
      fieldObj?.permission?.length === objVal?.length
    );
  };

  const handleChange = (e, value, input) => {
    let val = [...input.value] || [];
    if (e.target.checked) {
      val.push(value);
    } else {
      let index = indexOf(val, value);
      val.splice(index, 1);
    }
    input.onChange(val);
  };

  const handleSelectAllChange = (e, index, fields) => {
    let fieldVal = { ...fields.value[index] };
    let val = [];
    if (e.target.checked) {
      val = tagServicePerms[fieldVal.serviceName].map(({ value }) => value);
    }
    fieldVal.permission = val;
    fields.update(index, fieldVal);
  };

  const formInitialData = () => {
    let formData = {};
    if (inputVal?.value?.tableList?.length > 0) {
      formData.servicesDefType = inputVal.value.tableList.map((m) => {
        return {
          label: m.serviceName.toUpperCase(),
          value: m.serviceName
        };
      });
      formData.tableList = inputVal.value.tableList;
    }

    return formData;
  };

  const tagAccessTypeDisplayVal = (val) => {
    return val.map((m, index) => {
      return (
        <>
          <h6 className="d-inline mr-1" key={index}>
            <Badge variant="info">{m.serviceName.toUpperCase()}</Badge>
          </h6>
        </>
      );
    });
  };

  return (
    <>
      <div
        className="editable"
        onClick={() => {
          tagPermissionItem(true);
        }}
      >
        {inputVal?.value?.tableList?.length > 0 ? (
          <div className="text-center">
            <h6 className="d-inline mr-1 mb-1">
              <span className="editable-edit-text">
                {tagAccessTypeDisplayVal(inputVal?.value?.tableList)}
              </span>
            </h6>
            <Button
              className="mg-10 mx-auto d-block btn-mini"
              size="sm"
              variant="outline-dark"
              onClick={(e) => {
                e.stopPropagation();
                tagPermissionItem(true);
              }}
            >
              <i className="fa-fw fa fa-pencil"></i>
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <span className="editable-add-text">Add Permissions</span>
            <div>
              <Button
                size="sm"
                className="mg-10 mx-auto d-block btn-mini"
                variant="outline-dark"
                onClick={(e) => {
                  e.stopPropagation();
                  tagPermissionItem(true);
                }}
              >
                <i className="fa-fw fa fa-plus"></i>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        show={showTagPermissionItem}
        onHide={handleClose}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Form
          onSubmit={handleSubmit}
          initialValues={formInitialData()}
          mutators={{
            ...arrayMutators
          }}
          render={({
            handleSubmit,
            form: {
              mutators: { push, remove }
            },
            submitting,
            pristine,
            values
          }) => (
            <form onSubmit={handleSubmit}>
              <Modal.Header closeButton>
                <Modal.Title>Components Permissions</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Field
                  name="servicesDefType"
                  render={({ input, meta }) => (
                    <FormB.Group className="mb-3">
                      <b>Select Component:</b>
                      <Select
                        {...input}
                        onChange={(values, e) =>
                          serviceOnChange(e, input, values, push, remove)
                        }
                        isMulti
                        options={selectOptions(values)}
                        noOptionsMessage={({ inputValue }) =>
                          noOptionMsg(inputValue)
                        }
                        styles={{
                          noOptionsMessage: (base) => ({
                            ...base,
                            ...msgStyles
                          })
                        }}
                        components={{
                          DropdownIndicator: () => null,
                          IndicatorSeparator: () => null
                        }}
                        isClearable={false}
                        isSearchable={true}
                        placeholder="Select Service Name"
                      />
                    </FormB.Group>
                  )}
                />
                <Table striped bordered>
                  <thead>
                    <tr>
                      <th className="bg-white text-dark  align-middle text-center">
                        Component
                      </th>
                      <th className="bg-white text-dark align-middle text-center">
                        Permission
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <FieldArray name="tableList">
                      {({ fields, value }) =>
                        fields.map((name, index) => (
                          <tr className="bg-white" key={index}>
                            <td className="align-middle">
                              <h6>
                                <FormB.Group className="d-inline">
                                  <FormB.Check
                                    inline
                                    key={fields.value[
                                      index
                                    ].serviceName.toUpperCase()}
                                    checked={isAllChecked(
                                      fields.value[index],
                                      tagServicePerms[
                                        fields.value[index].serviceName
                                      ]
                                    )}
                                    type="checkbox"
                                    label={fields.value[
                                      index
                                    ].serviceName.toUpperCase()}
                                    onChange={(e) =>
                                      handleSelectAllChange(e, index, fields)
                                    }
                                  />
                                </FormB.Group>
                              </h6>
                            </td>
                            <td className="align-middle">
                              <Field
                                className="form-control"
                                name={`${name}.permission`}
                                render={({ input, meta }) => (
                                  <div>
                                    {tagServicePerms[
                                      fields.value[index].serviceName
                                    ].map((obj, index) => (
                                      <h6 className="d-inline" key={index}>
                                        <FormB.Group
                                          className="d-inline"
                                          controlId={obj.label}
                                          key={obj.label}
                                        >
                                          <FormB.Check
                                            inline
                                            checked={isChecked(
                                              obj.value,
                                              input
                                            )}
                                            type="checkbox"
                                            label={obj.label}
                                            onChange={(e) =>
                                              handleChange(e, obj.value, input)
                                            }
                                          />
                                        </FormB.Group>
                                      </h6>
                                    ))}
                                  </div>
                                )}
                              />
                            </td>
                          </tr>
                        ))
                      }
                    </FieldArray>
                  </tbody>
                </Table>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  className="btn-mini"
                  onClick={handleClose}
                >
                  Close
                </Button>

                <Button title="Save" className="btn-mini" type="submit">
                  Save
                </Button>
              </Modal.Footer>
            </form>
          )}
        />
      </Modal>
    </>
  );
}
