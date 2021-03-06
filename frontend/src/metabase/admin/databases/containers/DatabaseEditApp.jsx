/* @flow weak */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import title from "metabase/hoc/Title";
import { t } from "ttag";

import MetabaseSettings from "metabase/lib/settings";
import DeleteDatabaseModal from "../components/DeleteDatabaseModal.jsx";
import DatabaseEditForms from "../components/DatabaseEditForms.jsx";
import DatabaseSchedulingForm from "../components/DatabaseSchedulingForm";
import ActionButton from "metabase/components/ActionButton.jsx";
import Breadcrumbs from "metabase/components/Breadcrumbs.jsx";
import Radio from "metabase/components/Radio.jsx";
import ModalWithTrigger from "metabase/components/ModalWithTrigger.jsx";

import {
  getEditingDatabase,
  getFormState,
  getDatabaseCreationStep,
} from "../selectors";

import {
  reset,
  initializeDatabase,
  proceedWithDbCreation,
  saveDatabase,
  syncDatabaseSchema,
  rescanDatabaseFields,
  discardSavedFieldValues,
  deleteDatabase,
  selectEngine,
} from "../database";
import ConfirmContent from "metabase/components/ConfirmContent";
import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";

const mapStateToProps = (state, props) => ({
  database: getEditingDatabase(state),
  databaseCreationStep: getDatabaseCreationStep(state),
  formState: getFormState(state),
});

const mapDispatchToProps = {
  reset,
  initializeDatabase,
  proceedWithDbCreation,
  saveDatabase,
  syncDatabaseSchema,
  rescanDatabaseFields,
  discardSavedFieldValues,
  deleteDatabase,
  selectEngine,
};

type TabName = "connection" | "scheduling";
type TabOption = { name: string, value: TabName };

const TABS: TabOption[] = [
  { name: t`Connection`, value: "connection" },
  { name: t`Scheduling`, value: "scheduling" },
];

@connect(
  mapStateToProps,
  mapDispatchToProps,
)
@title(({ database }) => database && database.name)
export default class DatabaseEditApp extends Component {
  state: {
    currentTab: TabName,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      currentTab: TABS[0].value,
    };
  }

  static propTypes = {
    database: PropTypes.object,
    databaseCreationStep: PropTypes.string,
    formState: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    reset: PropTypes.func.isRequired,
    initializeDatabase: PropTypes.func.isRequired,
    syncDatabaseSchema: PropTypes.func.isRequired,
    rescanDatabaseFields: PropTypes.func.isRequired,
    discardSavedFieldValues: PropTypes.func.isRequired,
    proceedWithDbCreation: PropTypes.func.isRequired,
    deleteDatabase: PropTypes.func.isRequired,
    saveDatabase: PropTypes.func.isRequired,
    selectEngine: PropTypes.func.isRequired,
    location: PropTypes.object,
  };

  async componentWillMount() {
    await this.props.reset();
    await this.props.initializeDatabase(this.props.params.databaseId);
  }

  componentWillReceiveProps(nextProps) {
    const addingNewDatabase = !nextProps.database || !nextProps.database.id;

    if (addingNewDatabase) {
      // Update the current creation step (= active tab) if adding a new database
      this.setState({ currentTab: nextProps.databaseCreationStep });
    }
  }

  render() {
    let { database, formState } = this.props;
    const { currentTab } = this.state;

    const editingExistingDatabase = database && database.id != null;
    const addingNewDatabase = !editingExistingDatabase;

    const letUserControlScheduling =
      database &&
      database.details &&
      database.details["let-user-control-scheduling"];
    const showTabs = editingExistingDatabase && letUserControlScheduling;

    return (
      <div className="wrapper">
        <Breadcrumbs
          className="py4"
          crumbs={[
            [t`Databases`, "/admin/databases"],
            [addingNewDatabase ? t`Add Database` : database.name],
          ]}
        />
        <section className="Grid Grid--gutters Grid--2-of-3">
          <div className="Grid-cell">
            <div className="Form-new bordered rounded shadowed pt0">
              {showTabs && (
                <div className="Form-offset border-bottom">
                  <Radio
                    value={currentTab}
                    options={TABS}
                    onChange={currentTab => this.setState({ currentTab })}
                    underlined
                  />
                </div>
              )}
              <LoadingAndErrorWrapper loading={!database} error={null}>
                {() => (
                  <div>
                    {currentTab === "connection" && (
                      <DatabaseEditForms
                        database={database}
                        details={database ? database.details : null}
                        engines={MetabaseSettings.get("engines")}
                        hiddenFields={{ ssl: true }}
                        formState={formState}
                        selectEngine={this.props.selectEngine}
                        save={
                          addingNewDatabase
                            ? this.props.proceedWithDbCreation
                            : this.props.saveDatabase
                        }
                      />
                    )}
                    {currentTab === "scheduling" && (
                      <DatabaseSchedulingForm
                        database={database}
                        formState={formState}
                        // Use saveDatabase both for db creation and updating
                        save={this.props.saveDatabase}
                        submitButtonText={
                          addingNewDatabase ? t`Save` : t`Save changes`
                        }
                      />
                    )}
                  </div>
                )}
              </LoadingAndErrorWrapper>
            </div>
          </div>

          {/* Sidebar Actions */}
          {editingExistingDatabase && (
            <div className="Grid-cell Cell--1of3">
              <div className="Actions bordered rounded shadowed">
                <div className="Actions-group">
                  <label className="Actions-groupLabel block text-bold">{t`Actions`}</label>
                  <ol>
                    <li>
                      <ActionButton
                        actionFn={() =>
                          this.props.syncDatabaseSchema(database.id)
                        }
                        className="Button Button--syncDbSchema"
                        normalText={t`Sync database schema now`}
                        activeText={t`Starting…`}
                        failedText={t`Failed to sync`}
                        successText={t`Sync triggered!`}
                      />
                    </li>
                    <li className="mt2">
                      <ActionButton
                        actionFn={() =>
                          this.props.rescanDatabaseFields(database.id)
                        }
                        className="Button Button--rescanFieldValues"
                        normalText={t`Re-scan field values now`}
                        activeText={t`Starting…`}
                        failedText={t`Failed to start scan`}
                        successText={t`Scan triggered!`}
                      />
                    </li>
                  </ol>
                </div>

                <div className="Actions-group">
                  <label className="Actions-groupLabel block text-bold">{t`Danger Zone`}</label>
                  <ol>
                    <li>
                      <ModalWithTrigger
                        ref="discardSavedFieldValuesModal"
                        triggerClasses="Button Button--danger Button--discardSavedFieldValues"
                        triggerElement={t`Discard saved field values`}
                      >
                        <ConfirmContent
                          title={t`Discard saved field values`}
                          onClose={() =>
                            this.refs.discardSavedFieldValuesModal.toggle()
                          }
                          onAction={() =>
                            this.props.discardSavedFieldValues(database.id)
                          }
                        />
                      </ModalWithTrigger>
                    </li>

                    <li className="mt2">
                      <ModalWithTrigger
                        ref="deleteDatabaseModal"
                        triggerClasses="Button Button--deleteDatabase Button--danger"
                        triggerElement={t`Remove this database`}
                      >
                        <DeleteDatabaseModal
                          database={database}
                          onClose={() => this.refs.deleteDatabaseModal.toggle()}
                          onDelete={() =>
                            this.props.deleteDatabase(database.id, true)
                          }
                        />
                      </ModalWithTrigger>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }
}
